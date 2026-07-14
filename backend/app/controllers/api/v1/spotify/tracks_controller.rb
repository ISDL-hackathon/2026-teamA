module Api
  module V1
    module Spotify
      class TracksController < BaseController
        before_action :spotify_account

        def search
          return render_error("Query required", "QUERY_REQUIRED", :bad_request) if params[:q].blank?

          result = @spotify_account.search_tracks(params[:q], params.fetch(:limit, 10))
          render json: result, status: result[:status] == "success" ? :ok : :bad_request
        end

        def index
          tracks = @spotify_account.spotify_tracks.order(added_at: :desc)
          render json: {
            status: "success",
            tracks: tracks.as_json(only: [:id, :spotify_track_id, :track_name, :artist_name, :album_name, :duration_ms, :image_url, :preview_url, :added_at]),
            count: tracks.count
          }
        end

        def create
          track = @spotify_account.spotify_tracks.create!(track_params.merge(added_at: Time.current))
          render json: {
            status: "success",
            track: track.as_json(only: [:id, :spotify_track_id, :track_name, :artist_name, :album_name, :duration_ms, :image_url, :preview_url, :added_at])
          }, status: :created
        rescue ActiveRecord::RecordNotUnique
          render_error("This track is already in your favorites", "TRACK_ALREADY_EXISTS", :conflict)
        rescue ActiveRecord::RecordInvalid => e
          if e.record.errors.added?(:spotify_track_id, :taken)
            render_error("This track is already in your favorites", "TRACK_ALREADY_EXISTS", :conflict)
          else
            render_error(e.record.errors.full_messages.to_sentence, "TRACK_INVALID", :unprocessable_entity)
          end
        end

        def destroy
          track = if params[:id].to_s.match?(/\A\d+\z/)
                    @spotify_account.spotify_tracks.find_by(id: params[:id])
                  end
          track ||= @spotify_account.spotify_tracks.find_by!(spotify_track_id: params[:id])
          track.destroy!
          head :no_content
        end

        def devices
          result = SpotifyPlayerService.new(@spotify_account).devices
          render json: result, status: result[:status] == "success" ? :ok : :bad_request
        end

        def play
          spotify_track_id = params[:spotify_track_id].presence
          return render_error("Spotify track id required", "SPOTIFY_TRACK_ID_REQUIRED", :bad_request) if spotify_track_id.blank?

          result = SpotifyPlayerService.new(@spotify_account).play_track!(
            "spotify:track:#{spotify_track_id}",
            device_id: params[:device_id]
          )
          render json: result, status: result[:status] == "success" ? :ok : :bad_request
        end

        def pause
          result = SpotifyPlayerService.new(@spotify_account).pause!(device_id: params[:device_id])
          render json: result, status: result[:status] == "success" ? :ok : :bad_request
        end

        private

        def spotify_account
          @spotify_account = current_user.spotify_account || current_user.create_spotify_account!(
            spotify_user_id: "user-#{current_user.id}",
            token_expires_at: 1.hour.from_now
          )
        end

        def track_params
          params.require(:track).permit(:spotify_track_id, :track_name, :artist_name, :album_name, :duration_ms, :image_url, :preview_url)
        end
      end
    end
  end
end

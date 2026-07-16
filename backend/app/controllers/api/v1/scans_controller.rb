module Api
  module V1
    class ScansController < BaseController
      before_action :authenticate_api_key!

      def create
        idm = FelicaCard.normalize_idm(params[:idm])
        return render_error("IDm is required", "IDM_REQUIRED", :bad_request) if idm.blank?

        card = FelicaCard.find_by(idm: idm)
        return render_error("User not found for this card", "CARD_NOT_FOUND", :not_found) unless card

        log = RoomAccessService.new(card.user).record!
        playback_result = log.in? ? select_and_play_next_track(card.user) : nil

        render json: {
          status: "success",
          user_name: card.user.name,
          action: log.action_type,
          timestamp: log.timestamp.iso8601,
          playback: playback_result
        }
      rescue StandardError => e
        Rails.logger.error("[scan] #{e.class}: #{e.message}")
        render_error("Failed to process scan", "SCAN_FAILED", :internal_server_error)
      end

      private

      def select_and_play_next_track(user)
        service = AlexaQueueService.new
        selection_result = service.select_next_user
        update_roulette_state!(selection_result, user)
        return selection_result unless selection_result[:status] == "selected"

        service.play_selected_user(user_id: selection_result[:selected_user_id])
      end

      def update_roulette_state!(selection_result, user)
        RouletteState.update!(
          selection_result.merge(
            phase: selection_result[:status] == "selected" ? "result" : "error",
            selected_track: nil,
            updated_by: user.name
          )
        )
      end
    end
  end
end

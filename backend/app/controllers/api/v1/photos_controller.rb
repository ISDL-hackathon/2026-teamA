module Api
  module V1
    class PhotosController < BaseController
      def index
        photos = current_user.portal_photos.order(created_at: :desc)
        render json: {
          status: "success",
          photos: photos.map { |photo| photo_json(photo) },
          count: photos.count
        }
      end

      def create
        photo = current_user.portal_photos.create!(photo_params)
        render json: {
          status: "success",
          photo: photo_json(photo)
        }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render_error(e.record.errors.full_messages.to_sentence, "PHOTO_INVALID", :unprocessable_entity)
      end

      private

      def photo_params
        params.require(:photo).permit(:filename, :content_type, :byte_size, :image_data)
      end

      def photo_json(photo)
        photo.as_json(only: [:id, :filename, :content_type, :byte_size, :image_data, :created_at])
      end
    end
  end
end

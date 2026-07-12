module Api
  module V1
    class ScansController < BaseController
      before_action :enticate_api_key!

      def create
        idm = FelicaCard.normalize_idm(params[:idm])
        return render_error("IDm is required", "IDM_REQUIRED", :bad_request) if idm.blank?

        card = FelicaCard.find_by(idm: idm)
        return render_error("User not found for this card", "CARD_NOT_FOUND", :not_found) unless card

        log = RoomAccessService.new(card.user).record!

        render json: {
          status: "success",
          user_name: card.user.name,
          action: log.action_type,
          timestamp: log.timestamp.iso8601
        }
      rescue StandardError => e
        Rails.logger.error("[scan] #{e.class}: #{e.message}")
        render_error("Failed to process scan", "SCAN_FAILED", :internal_server_error)
      end
    end
  end
end

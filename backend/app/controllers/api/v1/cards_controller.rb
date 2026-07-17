module Api
  module V1
    class CardsController < BaseController
      before_action :require_current_user!

      def create
        idm = FelicaCard.normalize_idm(params[:idm])
        card = nil

        ActiveRecord::Base.transaction do
          card = FelicaCard.lock.find_by(idm: idm)
          current_user.felica_cards.where.not(id: card&.id).destroy_all

          if card
            card.update!(user: current_user)
          else
            card = current_user.felica_cards.create!(idm: idm)
          end
        end

        render json: { status: "success", card: card.as_json(only: [:id, :idm]) }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render_error(e.record.errors.full_messages.to_sentence, "CARD_INVALID", :unprocessable_entity)
      end

      private

      def require_current_user!
        return if current_user

        render_error("Login required", "LOGIN_REQUIRED", :unauthorized)
      end
    end
  end
end

module Api
  module V1
    class CardsController < BaseController
      def create
        card = current_user.felica_cards.create!(idm: params[:idm].to_s.upcase)
        render json: { status: "success", card: card.as_json(only: [:id, :idm]) }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render_error(e.record.errors.full_messages.to_sentence, "CARD_INVALID", :unprocessable_entity)
      end
    end
  end
end

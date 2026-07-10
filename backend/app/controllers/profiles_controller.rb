class ProfilesController < ApplicationController
  before_action :authenticate_user!

  def edit
    @felica_card = current_user.felica_cards.first
  end

  def update
    idm = profile_params[:idm].to_s.upcase.delete(" ")

    ActiveRecord::Base.transaction do
      current_user.update!(name_confirmed: true)

      card = current_user.felica_cards.first_or_initialize
      card.update!(idm: idm)
    end

    redirect_to portal_path
  rescue ActiveRecord::RecordInvalid => e
    @felica_card = current_user.felica_cards.first
    flash.now[:alert] = e.record.errors.full_messages.to_sentence
    render :edit, status: :unprocessable_entity
  end

  private

  def profile_params
    params.require(:profile).permit(:idm)
  end
end

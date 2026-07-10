class LaboratoriesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_completed_profile!

  def show
  end

  private

  def require_completed_profile!
    redirect_to setup_path unless current_user.profile_complete?
  end
end

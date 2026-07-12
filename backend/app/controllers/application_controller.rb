class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :authenticate_basic_auth_if_enabled
  helper_method :current_user, :logged_in?

  private

  def authenticate_basic_auth_if_enabled
    username = ENV.fetch("BASIC_AUTH_USERNAME", nil)
    password = ENV.fetch("BASIC_AUTH_PASSWORD", nil)
    return if username.blank? || password.blank?

    authenticate_or_request_with_http_basic("Room Portal") do |given_username, given_password|
      ActiveSupport::SecurityUtils.secure_compare(given_username, username) &
        ActiveSupport::SecurityUtils.secure_compare(given_password, password)
    end
  end

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = session[:user_id].present? ? User.find_by(id: session[:user_id]) : nil
  end

  def logged_in?
    current_user.present?
  end

  def authenticate_user!
    redirect_to login_path unless logged_in?
  end
end

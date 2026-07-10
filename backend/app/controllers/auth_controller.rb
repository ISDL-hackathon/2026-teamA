class AuthController < ApplicationController
  skip_before_action :verify_authenticity_token, only: :callback

  def login
    redirect_to(current_user.profile_complete? ? portal_path : setup_path) if logged_in?
  end

  def callback
    auth = request.env["omniauth.auth"]
    return redirect_to login_path, alert: "Auth0 login failed" if auth.blank?

    email = auth.dig("info", "email").presence || "#{auth.uid}@auth0.local"
    user = User.find_by(auth0_uid: auth.uid) || User.find_or_initialize_by(email: email)
    user.auth0_uid = auth.uid
    user.email = email
    user.name = auth.dig("info", "name").presence || auth.dig("info", "nickname").presence || user.email
    user.save!

    session[:user_id] = user.id
    redirect_to user.profile_complete? ? portal_path : setup_path
  end

  def failure
    flash[:alert] = params[:error_description].presence ||
                    params[:message].presence ||
                    "指定されたドメインではログインできません。"

    if auth0_configured?
      redirect_to "/auth/auth0?prompt=login", allow_other_host: true
    else
      redirect_to login_path
    end
  end

  def logout
    reset_session
    redirect_to auth0_logout_url, allow_other_host: true
  end

  private

  def auth0_configured?
    ENV["AUTH0_DOMAIN"].present? &&
      ENV["AUTH0_CLIENT_ID"].present? &&
      ENV["AUTH0_CLIENT_SECRET"].present?
  end

  def auth0_logout_url
    domain = ENV.fetch("AUTH0_DOMAIN", nil)
    client_id = ENV.fetch("AUTH0_CLIENT_ID", nil)
    return login_url if domain.blank? || client_id.blank?

    query = {
      client_id: client_id,
      returnTo: login_url
    }.to_query

    "https://#{domain}/v2/logout?#{query}"
  end
end

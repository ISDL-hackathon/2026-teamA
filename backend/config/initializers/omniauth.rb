auth0_domain = ENV.fetch("AUTH0_DOMAIN", nil)
auth0_client_id = ENV.fetch("AUTH0_CLIENT_ID", nil)
auth0_client_secret = ENV.fetch("AUTH0_CLIENT_SECRET", nil)

if auth0_domain.present? && auth0_client_id.present? && auth0_client_secret.present?
  Rails.application.config.middleware.use OmniAuth::Builder do
    provider(
      :auth0,
      auth0_client_id,
      auth0_client_secret,
      auth0_domain,
      callback_path: "/auth/auth0/callback",
      authorize_params: {
        scope: "openid profile email"
      }
    )
  end
end

OmniAuth.config.allowed_request_methods = %i[get post]
OmniAuth.config.silence_get_warning = true
OmniAuth.config.failure_raise_out_environments = []

module Api
  module V1
    class BaseController < ApplicationController
      skip_before_action :verify_authenticity_token
      

      private

      def current_user
        super || demo_user_unless_production
      end

      def authenticate_api_key!
        expected = ENV.fetch("API_KEY", nil)
        return if expected.blank?

        token = request.authorization.to_s.delete_prefix("Bearer ").strip
        return if ActiveSupport::SecurityUtils.secure_compare(token, expected)

        render json: { status: "error", message: "Unauthorized" }, status: :unauthorized
      end

      def render_error(message, code, status)
        render json: { status: "error", message: message, code: code }, status: status
      end

      def demo_user
        User.find_or_create_by!(email: "demo@example.com") do |user|
          user.name = "Demo User"
          user.auth0_uid = "demo-user"
        end
      end

      def demo_user_unless_production
        return if Rails.env.production?

        demo_user
      end
    end
  end
end

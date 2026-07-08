module Api
  module V1
    class AccessLogsController < BaseController
      def index
        logs = current_user.room_access_logs.order(timestamp: :desc).limit(50)
        render json: {
          status: "success",
          logs: logs.as_json(only: [:id, :action_type, :timestamp]),
          count: logs.count
        }
      end
    end
  end
end

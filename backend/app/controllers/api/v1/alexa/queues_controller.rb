module Api
  module V1
    module Alexa
      class QueuesController < BaseController
        def create
          result = AlexaQueueService.new.play_next_track
          render json: result, status: result[:status] == "success" ? :ok : :bad_request
        end
      end
    end
  end
end

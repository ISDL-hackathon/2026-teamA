class AlexaDevice < ApplicationRecord
  validates :device_id, :device_name, :location, presence: true
  validates :device_id, uniqueness: true
end

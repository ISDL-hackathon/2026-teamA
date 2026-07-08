class RoomAccessLog < ApplicationRecord
  belongs_to :user

  enum action_type: { in: 0, out: 1 }

  validates :action_type, :timestamp, presence: true
end

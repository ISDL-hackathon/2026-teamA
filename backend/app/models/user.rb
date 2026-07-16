class User < ApplicationRecord
  has_many :felica_cards, dependent: :destroy
  has_many :room_access_logs, dependent: :destroy
  has_many :spotify_play_events, dependent: :destroy
  has_many :portal_photos, dependent: :destroy
  has_one :spotify_account, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  def profile_complete?
    name_confirmed? && name.present? && felica_cards.exists?
  end

  def last_access_log
    room_access_logs.order(timestamp: :desc).first
  end

  def in_room?
    last_access_log&.in?
  end
end

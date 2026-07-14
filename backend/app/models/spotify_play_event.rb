class SpotifyPlayEvent < ApplicationRecord
  belongs_to :user
  belongs_to :spotify_track

  validates :selected_at, presence: true
end

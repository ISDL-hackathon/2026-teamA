class SpotifyTrack < ApplicationRecord
  belongs_to :spotify_account
  delegate :user, to: :spotify_account

  validates :spotify_track_id, :track_name, :artist_name, :added_at, presence: true
  validates :spotify_track_id, uniqueness: { scope: :spotify_account_id }
end

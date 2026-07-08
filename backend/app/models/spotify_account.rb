class SpotifyAccount < ApplicationRecord
  belongs_to :user
  has_many :spotify_tracks, dependent: :destroy

  validates :spotify_user_id, presence: true, uniqueness: true

  def token_expired?
    token_expires_at.blank? || token_expires_at < Time.current
  end

  def search_tracks(query, limit = 10)
    SpotifySearchService.new(access_token).search_tracks(query, limit)
  end
end

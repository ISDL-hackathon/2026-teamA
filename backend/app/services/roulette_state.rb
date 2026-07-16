class RouletteState
  CACHE_KEY = "room_portal:roulette_state".freeze

  DEFAULT_STATE = {
    phase: "idle",
    message: "選曲ルーレット待機中",
    selected_user: nil,
    selected_user_id: nil,
    selected_track: nil,
    roulette_stop_angle: nil,
    roulette_candidates: [],
    updated_at: nil,
    updated_by: nil
  }.freeze

  def self.current
    Rails.cache.read(CACHE_KEY) || DEFAULT_STATE
  end

  def self.update!(attributes)
    state = DEFAULT_STATE.merge(current).merge(attributes.compact)
    state[:updated_at] = Time.current.iso8601(6)
    Rails.cache.write(CACHE_KEY, state)
    state
  end
end

class AlexaQueueService
  MIN_WEIGHT_MINUTES = 1.0

  def select_next_user
    candidates = candidate_users
    return error("No IC card registered users", "NO_CARD_REGISTERED_USERS") if candidates.empty?

    weights = selection_weights(candidates)
    roulette = roulette_select(candidates, weights)
    selected_user = roulette[:user]

    {
      status: "selected",
      message: "当選者を選びました。",
      selected_user: selected_user.name,
      selected_user_id: selected_user.id,
      selected_track: nil,
      probability: probability_for(selected_user, weights),
      roulette_candidates: roulette_candidates(candidates, weights),
      roulette_stop_angle: roulette[:stop_angle],
      timestamp: Time.current.iso8601
    }
  end

  def play_selected_user(user_id:, device_id: nil)
    selected_user = User.includes(spotify_account: :spotify_tracks).find_by(id: user_id)
    return error("Selected user was not found", "SELECTED_USER_NOT_FOUND") unless selected_user

    play_user_track(selected_user, device_id: device_id)
  end

  def play_next_track(device_id: nil)
    candidates = candidate_users
    return error("No IC card registered users", "NO_CARD_REGISTERED_USERS") if candidates.empty?

    weights = selection_weights(candidates)
    roulette = roulette_select(candidates, weights)
    selected_user = roulette[:user]
    roulette_stop_angle = roulette[:stop_angle]
    play_user_track(
      selected_user,
      candidates: candidates,
      weights: weights,
      roulette_stop_angle: roulette_stop_angle,
      device_id: device_id
    )
  end

  private

  def play_user_track(selected_user, candidates: nil, weights: nil, roulette_stop_angle: nil, device_id: nil)
    track = selected_user.spotify_account&.spotify_tracks&.sample
    if track.blank?
      return no_track_result(selected_user, candidates, weights, roulette_stop_angle)
    end

    track_uri = "spotify:track:#{track.spotify_track_id}"

    playback = SpotifyPlayerService.new.play_track!(track_uri, device_id: device_id)
    return playback_error(playback, selected_user, track, track_uri, candidates, weights, roulette_stop_angle) unless playback[:status] == "success"

    SpotifyPlayEvent.create!(user: selected_user, spotify_track: track, selected_at: Time.current)

    {
      status: "success",
      selected_user: selected_user.name,
      selected_user_id: selected_user.id,
      selected_track: "#{track.track_name} - #{track.artist_name}",
      spotify_track_id: track.spotify_track_id,
      duration_ms: track.duration_ms,
      track_uri: track_uri,
      probability: weights.present? ? probability_for(selected_user, weights) : nil,
      roulette_candidates: candidates.present? && weights.present? ? roulette_candidates(candidates, weights) : [],
      roulette_stop_angle: roulette_stop_angle,
      timestamp: Time.current.iso8601
    }
  end

  def candidate_users
    User.includes(:room_access_logs, :felica_cards, spotify_account: :spotify_tracks)
        .joins(:felica_cards)
        .distinct
        .to_a
  end

  def selection_weights(users)
    users.each_with_object({}) do |user, result|
      result[user.id] = weekly_stay_minutes(user)
    end
  end

  def weekly_stay_minutes(user)
    now = Time.current
    start_time = now.beginning_of_week
    logs = user.room_access_logs.where("timestamp >= ?", start_time - RoomAccessSummary::MAX_OPEN_SESSION).to_a
    minutes = RoomAccessSummary.new(logs, now).duration_between(start_time, now).to_f / 60.0

    [minutes, MIN_WEIGHT_MINUTES].max
  end

  def roulette_select(users, weights)
    ranges = roulette_ranges(users, weights)
    stop_angle = rand * 360.0
    selected_range = ranges.find { |range| stop_angle >= range[:start_angle] && stop_angle < range[:end_angle] }

    {
      user: selected_range&.fetch(:user) || users.last,
      stop_angle: stop_angle.round(3)
    }
  end

  def roulette_ranges(users, weights)
    total = weights.values.sum.to_f
    cursor = 0.0

    users.map.with_index do |user, index|
      angle = total.positive? ? (weights[user.id].to_f / total) * 360.0 : 360.0 / users.size
      end_angle = index == users.size - 1 ? 360.0 : cursor + angle
      range = { user: user, start_angle: cursor, end_angle: end_angle }
      cursor = end_angle
      range
    end
  end

  def probability_for(user, weights)
    total = weights.values.sum.to_f
    return 0 if total.zero?

    (weights[user.id].to_f / total).round(4)
  end

  def roulette_candidates(users, weights)
    users.map do |user|
      {
        user_id: user.id,
        name: user.name,
        week_minutes: weights[user.id].to_f.round(1),
        probability: probability_for(user, weights)
      }
    end
  end

  def no_track_result(selected_user, candidates, weights, roulette_stop_angle)
    {
      status: "no_track",
      message: "お気に入りされている登録がありません。楽曲のお気に入り登録お願いします。",
      selected_user: selected_user.name,
      selected_user_id: selected_user.id,
      selected_track: nil,
      spotify_track_id: nil,
      duration_ms: nil,
      track_uri: nil,
      probability: weights.present? ? probability_for(selected_user, weights) : nil,
      roulette_candidates: candidates.present? && weights.present? ? roulette_candidates(candidates, weights) : [],
      roulette_stop_angle: roulette_stop_angle,
      timestamp: Time.current.iso8601
    }
  end

  def playback_error(playback, selected_user, track, track_uri, candidates, weights, roulette_stop_angle)
    playback.merge(
      selected_user: selected_user.name,
      selected_user_id: selected_user.id,
      selected_track: "#{track.track_name} - #{track.artist_name}",
      spotify_track_id: track.spotify_track_id,
      duration_ms: track.duration_ms,
      track_uri: track_uri,
      probability: weights.present? ? probability_for(selected_user, weights) : nil,
      roulette_candidates: candidates.present? && weights.present? ? roulette_candidates(candidates, weights) : [],
      roulette_stop_angle: roulette_stop_angle,
      timestamp: Time.current.iso8601
    )
  end

  def error(message, code)
    { status: "error", message: message, code: code }
  end
end

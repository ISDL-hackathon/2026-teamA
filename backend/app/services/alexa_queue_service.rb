class AlexaQueueService
  def play_next_track
    users = in_room_users
    return error("No users currently in room", "NO_USERS_IN_ROOM") if users.empty?

    durations = stay_durations(users)
    probabilities = calculate_probabilities(durations)
    selected_user = roulette_select(users, probabilities)
    track = selected_user.spotify_account&.spotify_tracks&.sample
    return error("No tracks available", "NO_TRACKS_AVAILABLE") unless track

    {
      status: "success",
      selected_user: selected_user.name,
      selected_track: "#{track.track_name} - #{track.artist_name}",
      track_uri: "spotify:track:#{track.spotify_track_id}",
      probability: probabilities[selected_user.id].round(4),
      timestamp: Time.current.iso8601
    }
  end

  private

  def in_room_users
    User.includes(:room_access_logs, spotify_account: :spotify_tracks).select(&:in_room?)
  end

  def stay_durations(users)
    users.each_with_object({}) do |user, result|
      total = 0
      entered_at = nil

      user.room_access_logs.where("timestamp >= ?", Time.current.beginning_of_day).order(:timestamp).each do |log|
        if log.in?
          entered_at = log.timestamp
        elsif entered_at
          total += log.timestamp - entered_at
          entered_at = nil
        end
      end

      total += Time.current - entered_at if entered_at
      result[user.id] = total
    end
  end

  def calculate_probabilities(durations)
    total = durations.values.sum.to_f
    return durations.transform_values { 0 } if total.zero?

    durations.transform_values { |duration| duration / total }
  end

  def roulette_select(users, probabilities)
    threshold = rand
    cumulative = 0.0

    users.each do |user|
      cumulative += probabilities[user.id].to_f
      return user if threshold <= cumulative
    end

    users.last
  end

  def error(message, code)
    { status: "error", message: message, code: code }
  end
end

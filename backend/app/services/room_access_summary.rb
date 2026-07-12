class RoomAccessSummary
  MAX_OPEN_SESSION = 12.hours

  def initialize(logs, now = Time.current)
    @logs = logs.sort_by(&:timestamp)
    @now = now
  end

  def in_room?
    current_session&.dig(:open) == true
  end

  def current_since
    current_session&.dig(:started_at)
  end

  def current_duration
    session = current_session
    return 0 unless session&.dig(:open)

    session_duration(session)
  end

  def duration_between(start_time, end_time)
    sessions.sum do |session|
      overlap_seconds(session, start_time, end_time)
    end
  end

  def sessions_between(start_time, end_time)
    sessions.filter_map do |session|
      seconds = overlap_seconds(session, start_time, end_time)
      next if seconds.zero?

      {
        started_at: [session[:started_at], start_time].max,
        ended_at: [session[:ended_at], end_time].min,
        open: session[:open] && session[:ended_at] <= end_time,
        duration_seconds: seconds
      }
    end
  end

  private

  attr_reader :logs, :now

  def sessions
    @sessions ||= begin
      result = []
      open_started_at = nil

      logs.each do |log|
        if log.in?
          if open_started_at
            result << build_session(open_started_at, [log.timestamp, open_started_at + MAX_OPEN_SESSION].min, false)
          end
          open_started_at = log.timestamp
        elsif log.out? && open_started_at
          result << build_session(open_started_at, [log.timestamp, open_started_at + MAX_OPEN_SESSION].min, false)
          open_started_at = nil
        end
      end

      if open_started_at
        ended_at = [now, open_started_at + MAX_OPEN_SESSION].min
        result << build_session(open_started_at, ended_at, ended_at == now)
      end

      result
    end
  end

  def current_session
    sessions.reverse.find { |session| session[:open] }
  end

  def build_session(started_at, ended_at, open)
    {
      started_at: started_at,
      ended_at: ended_at,
      open: open,
      duration_seconds: (ended_at - started_at).to_i
    }
  end

  def session_duration(session)
    session[:duration_seconds].to_i
  end

  def overlap_seconds(session, start_time, end_time)
    started_at = [session[:started_at], start_time].max
    ended_at = [session[:ended_at], end_time].min
    return 0 if ended_at <= started_at

    (ended_at - started_at).to_i
  end
end

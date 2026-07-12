module ApplicationHelper
  def format_stay_duration(seconds)
    total_minutes = (seconds.to_i / 60).clamp(0, Float::INFINITY)
    hours = total_minutes / 60
    minutes = total_minutes % 60

    return "#{minutes}分" if hours.zero?

    "#{hours}時間#{minutes.to_s.rjust(2, '0')}分"
  end

  def format_stay_time(time)
    return "--:--" unless time

    time.strftime("%H:%M")
  end

  def format_stay_date(time)
    return "-" unless time

    time.strftime("%Y/%m/%d")
  end
end

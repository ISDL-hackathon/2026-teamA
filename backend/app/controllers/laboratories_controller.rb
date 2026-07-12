class LaboratoriesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_completed_profile!

  def show
    @spotify_account = current_user.spotify_account || current_user.create_spotify_account!(
      spotify_user_id: "user-#{current_user.id}",
      token_expires_at: 1.hour.from_now
    )
    @favorite_tracks = @spotify_account.spotify_tracks.order(added_at: :desc)
    @spotify_env_ready = ENV["SPOTIFY_ACCESS_TOKEN"].present? ||
                         (ENV["SPOTIFY_CLIENT_ID"].present? && ENV["SPOTIFY_CLIENT_SECRET"].present?)
    build_room_access_dashboard
  end

  private

  def require_completed_profile!
    redirect_to setup_path unless current_user.profile_complete?
  end

  def build_room_access_dashboard
    now = Time.current
    today_start = now.beginning_of_day
    week_start = now.beginning_of_week
    month_start = now.beginning_of_month

    users = User.includes(:room_access_logs).order(:name)

    @room_access_rows = users.map do |user|
      summary = RoomAccessSummary.new(user.room_access_logs, now)
      {
        user: user,
        in_room: summary.in_room?,
        current_since: summary.current_since,
        current_duration_seconds: summary.current_duration,
        today_seconds: summary.duration_between(today_start, now),
        week_seconds: summary.duration_between(week_start, now),
        month_seconds: summary.duration_between(month_start, now)
      }
    end

    @room_access_rows.sort_by! { |row| [-row[:week_seconds], row[:user].name] }

    current_user_summary = RoomAccessSummary.new(current_user.room_access_logs, now)
    @my_access_summary = {
      today_seconds: current_user_summary.duration_between(today_start, now),
      week_seconds: current_user_summary.duration_between(week_start, now),
      month_seconds: current_user_summary.duration_between(month_start, now)
    }
    @my_access_sessions = current_user_summary.sessions_between(1.month.ago.beginning_of_day, now).reverse

    @calendar_initial_month = Time.zone.today.beginning_of_month
    @calendar_events = current_user_summary.sessions_between(100.years.ago.beginning_of_day, 100.years.from_now.end_of_day).map do |session|
      {
        date: session[:started_at].to_date.iso8601,
        started_at: session[:started_at].iso8601,
        ended_at: session[:ended_at].iso8601,
        open: session[:open],
        duration_seconds: session[:duration_seconds]
      }
    end
  end
end

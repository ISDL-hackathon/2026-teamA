class RoomAccessService
  def initialize(user, now = Time.current)
    @user = user
    @now = now
  end

  def record!
    @user.room_access_logs.create!(
      action_type: next_action,
      timestamp: @now
    )
  end

  private

  def next_action
    last_log = @user.last_access_log
    return :out if last_log&.in? && last_log.timestamp > 12.hours.ago

    :in
  end
end

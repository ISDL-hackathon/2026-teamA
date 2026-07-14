module SpotifyEnv
  module_function

  def fetch(key)
    ENV[key].presence || root_env.fetch(key, nil).presence
  end

  def root_env
    @root_env ||= begin
      env_path = Rails.root.join("..", ".env")
      return {} unless File.exist?(env_path)

      File.readlines(env_path).each_with_object({}) do |line, result|
        next if line.blank? || line.start_with?("#")

        env_key, value = line.split("=", 2)
        next if env_key.blank? || value.blank?

        result[env_key.strip] = value.strip.delete_prefix('"').delete_suffix('"')
      end
    end
  end
end

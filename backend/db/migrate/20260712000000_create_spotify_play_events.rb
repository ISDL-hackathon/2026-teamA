class CreateSpotifyPlayEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :spotify_play_events do |t|
      t.references :user, null: false, foreign_key: true
      t.references :spotify_track, null: false, foreign_key: true
      t.datetime :selected_at, null: false

      t.timestamps
    end

    add_index :spotify_play_events, :selected_at
  end
end

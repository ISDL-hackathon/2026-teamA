class CreatePortalTables < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.string :auth0_uid
      t.string :name, null: false
      t.string :email, null: false

      t.timestamps
    end

    add_index :users, :auth0_uid, unique: true
    add_index :users, :email, unique: true

    create_table :felica_cards do |t|
      t.references :user, null: false, foreign_key: true
      t.string :idm, null: false

      t.timestamps
    end

    add_index :felica_cards, :idm, unique: true

    create_table :room_access_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :action_type, null: false
      t.datetime :timestamp, null: false

      t.timestamps
    end

    add_index :room_access_logs, [:user_id, :timestamp]

    create_table :spotify_accounts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :spotify_user_id, null: false
      t.string :access_token
      t.string :refresh_token
      t.datetime :token_expires_at

      t.timestamps
    end

    add_index :spotify_accounts, :spotify_user_id, unique: true

    create_table :spotify_tracks do |t|
      t.references :spotify_account, null: false, foreign_key: true
      t.string :spotify_track_id, null: false
      t.string :track_name, null: false
      t.string :artist_name, null: false
      t.string :album_name
      t.integer :duration_ms
      t.string :image_url
      t.string :preview_url
      t.datetime :added_at, null: false

      t.timestamps
    end

    add_index :spotify_tracks, [:spotify_account_id, :spotify_track_id], unique: true

    create_table :alexa_devices do |t|
      t.string :device_id, null: false
      t.string :device_name, null: false
      t.string :location, null: false
      t.boolean :is_active, null: false, default: true

      t.timestamps
    end

    add_index :alexa_devices, :device_id, unique: true
  end
end

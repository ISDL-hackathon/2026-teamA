# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2026_07_12_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "alexa_devices", force: :cascade do |t|
    t.string "device_id", null: false
    t.string "device_name", null: false
    t.string "location", null: false
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["device_id"], name: "index_alexa_devices_on_device_id", unique: true
  end

  create_table "felica_cards", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "idm", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["idm"], name: "index_felica_cards_on_idm", unique: true
    t.index ["user_id"], name: "index_felica_cards_on_user_id"
  end

  create_table "portal_photos", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "filename", null: false
    t.string "content_type", null: false
    t.integer "byte_size", null: false
    t.text "image_data", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "created_at"], name: "index_portal_photos_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_portal_photos_on_user_id"
  end

  create_table "room_access_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "action_type", null: false
    t.datetime "timestamp", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "timestamp"], name: "index_room_access_logs_on_user_id_and_timestamp"
    t.index ["user_id"], name: "index_room_access_logs_on_user_id"
  end

  create_table "spotify_accounts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "spotify_user_id", null: false
    t.string "access_token"
    t.string "refresh_token"
    t.datetime "token_expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["spotify_user_id"], name: "index_spotify_accounts_on_spotify_user_id", unique: true
    t.index ["user_id"], name: "index_spotify_accounts_on_user_id"
  end

  create_table "spotify_play_events", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "spotify_track_id", null: false
    t.datetime "selected_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["selected_at"], name: "index_spotify_play_events_on_selected_at"
    t.index ["spotify_track_id"], name: "index_spotify_play_events_on_spotify_track_id"
    t.index ["user_id"], name: "index_spotify_play_events_on_user_id"
  end

  create_table "spotify_tracks", force: :cascade do |t|
    t.bigint "spotify_account_id", null: false
    t.string "spotify_track_id", null: false
    t.string "track_name", null: false
    t.string "artist_name", null: false
    t.string "album_name"
    t.integer "duration_ms"
    t.string "image_url"
    t.string "preview_url"
    t.datetime "added_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["spotify_account_id", "spotify_track_id"], name: "index_spotify_tracks_on_spotify_account_id_and_spotify_track_id", unique: true
    t.index ["spotify_account_id"], name: "index_spotify_tracks_on_spotify_account_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "auth0_uid"
    t.string "name", null: false
    t.string "email", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "name_confirmed", default: false, null: false
    t.index ["auth0_uid"], name: "index_users_on_auth0_uid", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "felica_cards", "users"
  add_foreign_key "portal_photos", "users"
  add_foreign_key "room_access_logs", "users"
  add_foreign_key "spotify_accounts", "users"
  add_foreign_key "spotify_play_events", "spotify_tracks"
  add_foreign_key "spotify_play_events", "users"
  add_foreign_key "spotify_tracks", "spotify_accounts"
end

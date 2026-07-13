class CreatePortalPhotos < ActiveRecord::Migration[7.0]
  def change
    create_table :portal_photos do |t|
      t.references :user, null: false, foreign_key: true
      t.string :filename, null: false
      t.string :content_type, null: false
      t.integer :byte_size, null: false
      t.text :image_data, null: false

      t.timestamps
    end

    add_index :portal_photos, [:user_id, :created_at]
  end
end

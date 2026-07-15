class AddCategoryToPortalPhotos < ActiveRecord::Migration[7.0]
  def change
    add_column :portal_photos, :category, :string, null: false, default: "other"
    add_index :portal_photos, [:user_id, :category, :created_at]
  end
end

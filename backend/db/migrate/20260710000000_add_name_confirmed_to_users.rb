class AddNameConfirmedToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :name_confirmed, :boolean, null: false, default: false
  end
end

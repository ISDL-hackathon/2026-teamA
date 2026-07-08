class FelicaCard < ApplicationRecord
  belongs_to :user

  validates :idm, presence: true, uniqueness: true
end

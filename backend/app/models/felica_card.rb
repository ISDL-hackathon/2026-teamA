class FelicaCard < ApplicationRecord
  belongs_to :user

  before_validation :normalize_idm

  validates :idm, presence: true, uniqueness: true
  validates :idm, format: { with: /\A\h{16}\z/, message: "must be 16 hexadecimal characters" }, allow_blank: true

  def self.normalize_idm(value)
    value.to_s.upcase.gsub(/[^0-9A-F]/, "")
  end

  private

  def normalize_idm
    self.idm = self.class.normalize_idm(idm)
  end
end

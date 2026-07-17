class FelicaCard < ApplicationRecord
  CARD_ID_LENGTHS = [8, 14, 16, 17, 20].freeze

  belongs_to :user

  before_validation :normalize_idm

  validates :idm, presence: true, uniqueness: true
  validates :idm, format: { with: /\A\h+\z/, message: "must be hexadecimal characters" }, allow_blank: true
  validate :idm_has_supported_length

  def self.normalize_idm(value)
    value.to_s.upcase.gsub(/[^0-9A-F]/, "")
  end

  private

  def idm_has_supported_length
    return if idm.blank? || CARD_ID_LENGTHS.include?(idm.length)

    errors.add(:idm, "must be 8, 14, 16, 17, or 20 hexadecimal characters")
  end

  def normalize_idm
    self.idm = self.class.normalize_idm(idm)
  end
end

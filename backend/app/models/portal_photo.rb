class PortalPhoto < ApplicationRecord
  MAX_IMAGE_SIZE = 5.megabytes
  CATEGORIES = {
    "lab_trip" => "旅行（研究室メンバー）",
    "conference" => "学会",
    "event" => "イベント",
    "other" => "その他"
  }.freeze

  belongs_to :user

  validates :filename, :content_type, :image_data, :category, presence: true
  validates :category, inclusion: { in: CATEGORIES.keys }
  validates :byte_size, numericality: { greater_than: 0, less_than_or_equal_to: MAX_IMAGE_SIZE }
  validate :image_content_type
  validate :image_data_format

  private

  def image_content_type
    return if content_type.to_s.start_with?("image/")

    errors.add(:content_type, "must be an image")
  end

  def image_data_format
    return if image_data.to_s.start_with?("data:image/")

    errors.add(:image_data, "must be an image data URL")
  end
end

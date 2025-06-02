cask "claude-usage-tracker" do
  version "0.0.3"
  
  if Hardware::CPU.intel?
    sha256 "a1277932e2404cfda09ebabb8ae9079671c3b938de8ac2c404dceb7cbc7c4b39"
    url "https://github.com/penicillin0/claude-usage-tracker-for-mac/releases/download/v#{version}/Claude.Usage.Tracker-#{version}.dmg"
  else
    sha256 "87be8954e7b75504a23e9ac5238f6eed45cbe8927fcd95272562de5690b90188"
    url "https://github.com/penicillin0/claude-usage-tracker-for-mac/releases/download/v#{version}/Claude.Usage.Tracker-#{version}-arm64.dmg"
  end

  name "Claude Usage Tracker"
  desc "Menu bar app to visualize Claude Code usage and costs"
  homepage "https://github.com/penicillin0/claude-usage-tracker-for-mac"

  depends_on macos: ">= :high_sierra"

  app "Claude Usage Tracker.app"

  zap trash: [
    "~/Library/Application Support/Claude Usage Tracker",
    "~/Library/Preferences/com.penicillin0.claude-usage-tracker.plist",
  ]
end
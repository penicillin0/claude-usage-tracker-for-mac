cask "claude-usage-tracker" do
  version "0.0.3"
  
  if Hardware::CPU.intel?
    sha256 "8e80313025ce86605b35541d500731b4e1a312d1f0e62799ca8ad78a2d5b7c57"
    url "https://github.com/penicillin0/claude-usage-tracker-for-mac/releases/download/v#{version}/Claude.Usage.Tracker-#{version}.dmg"
  else
    sha256 "bde1a28e698bbeb61cbecb4ebf42c4d2c7a6c9eb882ab708a5392b0c98968c45"
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

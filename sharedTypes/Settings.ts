type SettingsItem = {
  name: string;
  val: boolean | string;
};

type Settings = {
  Design: {
    boxShadow: SettingsItem;
    theme: SettingsItem;
  };
  Performance: {
    intervalUpdatecheck: SettingsItem;
  };
};

export default Settings;

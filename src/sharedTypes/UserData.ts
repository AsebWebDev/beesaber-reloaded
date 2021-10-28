export type UserData =
  | Record<string, unknown>
  | {
      countryRank: number;
      county: string;
      googleId: string;
      password: string; // TODO: Type correctly
      profilePic: string;
      rank: number;
      totalPlayCount: number;
      totalScore: number;
      username: string;
    };

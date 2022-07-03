export interface GithubPinnedRepos {
  data: {
    user: {
      pinnedItems: {
        nodes: {
          name: string;
          url: string;
          description: string;
          languages: {
            nodes: {
              name: string;
            }[];
          };
        }[];
      };
    };
  };
}

export interface PinnedReposAPIResponse {
  status: number;
  body: GithubPinnedRepos | null;
  ok: boolean;
  error?: unknown;
}

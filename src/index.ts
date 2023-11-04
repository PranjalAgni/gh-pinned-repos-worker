import { Env } from "./interface/env";
import { GithubPinnedRepos } from "./interface/github";
import { getPinnedRepos } from "./service";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const getGithubUsername = (request: Request) => {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  return username;
};

const isResponseValid = (response: GithubPinnedRepos | null) => {
  console.log(response);
  return response && response.data.user !== null;
};

const convertResponseToPinnedRepositoryList = (response: GithubPinnedRepos) => {
  const { pinnedItems } = response?.data?.user;
  const pinnedRepos = pinnedItems.nodes.map((node, idx) => {
    return {
      id: idx.toString(),
      repo: node.name,
      url: node.url,
      description: node.description,
      language: node.languages.nodes.map((languageNode) => languageNode.name),
    };
  });

  return pinnedRepos;
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const username = getGithubUsername(request);
    if (!username) {
      return new Response(
        JSON.stringify({
          error: true,
          message: `Username not found, example GET request ${request.url}?username=GH_USERNAME`,
        }),
        {
          status: 500,
        }
      );
    }
    const githubData = await getPinnedRepos(username, env?.GH_TOKEN);
    const isValid = githubData.ok && isResponseValid(githubData.body);
    if (isValid) {
      const pinnedRepos = convertResponseToPinnedRepositoryList(
        githubData.body as GithubPinnedRepos
      );

      return new Response(JSON.stringify(pinnedRepos, null, 3));
    } else {
      return new Response(
        JSON.stringify({
          error: githubData.error,
          status: githubData.status,
        })
      );
    }
  },
};

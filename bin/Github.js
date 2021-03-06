const request = require("request-promise");
const path = require("path");
const exec = require("util").promisify(require("child_process").exec);

class Github {
  /**
   * Create repositories on Github an array
   * of Bitbucket repositories
   *
   * @param {Array} repositories
   * @returns {Array} of successfully created `repositories`
   */
  static async createRepositories(repositories) {
    const successfulRepos = [];
    await Promise.all(repositories.map(async repo => {
      try {
        await Github.createRepository(repo);
        successfulRepos.push(repo);
        console.log(`created repository for ${repo.slug}`);

      } catch (error) {
        console.log(`error creating repository for ${repo.slug}`);
      }
    }));
    return successfulRepos;
  }

  /**
   * Create a new repository on Github.
   *
   * @param {Object} repository single Bitbucket repo resource
   * @returns {Bolean} success status
   */
  static async createRepository(repository) {
    try {
      // make the request for a new repo
      await request.post({
        url: "https://api.github.com/user/repos",
        body: {
          name: repository.slug,
          description: repository.description,
          private: repository.is_private,
          has_issues: repository.has_issues,
          has_wiki: repository.has_wiki
        },
        headers: {
          "User-Agent": "UA is required",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        },
        json: true
      });
    } catch (e) {
      // something went wrong, log the message
      // but don't kill the script
      const errors = e.error.errors;

      for (let i = 0; i < errors.length; i++) {
        console.log(
          "Failed creating repository",
          repository.slug + ",",
          errors[i].message + "."
        );
      }
      throw e;
    }
  }

  static async pushRepositories(repositories) {
    // keep track of which repos have failed to be pushed to Github
    const successfulRepos = [];
    await Promise.all(repositories.map(async repo => {
      try {
        await Github.pushRepository(repo);
        successfulRepos.push(repo);
        console.log(`successfully pushed repository ${repo.slug}`);
      } catch (e) {
        console.log(e);
        console.log(`failed to push repository ${repo.slug}`);
      }
    }));
    return successfulRepos;
  }

  /**
   * Push to the repository a new repository on Github.
   *
   * @param {Object} repository single Bitbucket repo resource
   * @returns {Bolean} success status
   */
  static async pushRepository(repository) {
    // set upstream
    // push

    // path to the local repository
    const pathToRepo = path.resolve(
      __dirname,
      "../repositories/",
      repository.slug
    );

    // initialize a folder and git repo on this machine
    // add Bitbucket as a remote and pull
    const commands = ` cd ${pathToRepo} \
                && git init \
                && git remote set-url origin https://${
                  process.env.GITHUB_USERNAME
                }:${process.env.GITHUB_TOKEN}@github.com/${
      process.env.GITHUB_USERNAME
    }/${repository.slug}.git \
                && git push origin master`;
    try {
      // initialize repo
      await exec(commands);
    } catch (e) {
      console.log(e);
      console.log("couldn't push repository", repository.slug);
    }
  }
}

module.exports = Github;

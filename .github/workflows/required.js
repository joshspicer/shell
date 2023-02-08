module.exports = async ({ github, context }) => {
  const workflow = await github.rest.actions.getWorkflowRun({
    ...context.repo,
    run_id: process.env.RUN_ID,
  });

  console.log(`Processing ${workflow.data.name} ${workflow.data.html_url}`);
  console.log(
    'https://github.com/' +
      process.env.GITHUB_REPOSITORY +
      '/commit/' +
      workflow.data.head_sha +
      '/checks',
  );

  // list all workflows runs for the same head_sha
  const workflowRuns = await github.rest.actions.listWorkflowRunsForRepo({
    ...context.repo,
    head_sha: workflow.data.head_sha,
  });

  // loop through all required workflows
  var foundRequired = false;
  var reportedPending = false;
  var allRequiredSucceeded = true;

  for (const workflowRun of workflowRuns.data.workflow_runs) {
    if (!workflowRun.name.match(/required/i)) {
      console.log(
        `Ignoring ${workflowRun.name} because it does not match /required/i`,
      );
      continue;
    }

    console.log(
      `Processing ${workflowRun.name} with conclusion ${workflowRun.conclusion} ${workflowRun.html_url}...`,
    );
    foundRequired = true;

    if (workflowRun.conclusion == 'success') {
      console.log(`Success!`);
      allRequiredSucceeded = allRequiredSucceeded && true;
    } else if (workflowRun.conclusion == 'skipped') {
      console.log(
        `Skipped! We'll count that as an optimization and thus success.`,
      );
      allRequiredSucceeded = allRequiredSucceeded && true;
    } else {
      allRequiredSucceeded = false;

      if (workflowRun.conclusion && workflowRun.conclusion != 'cancelled') {
        console.log(
          `${workflowRun.conclusion}! Creating a status on ${workflow.data.head_sha} ...`,
        );

        await github.rest.repos.createCommitStatus({
          ...context.repo,
          sha: workflow.data.head_sha,
          state: 'failure',
          context: process.env.STATUS_NAME,
          description:
            'The ' +
            workflowRun.name +
            ' workflow reports ' +
            workflowRun.conclusion +
            '.',
          target_url: process.env.THIS_RUN_URL,
        });

        console.log(
          `Done, will check the rest of the statuses in the next run`,
        );
        return;
      } else {
        console.log(`Appears to still be running!`);

        if (!reportedPending) {
          console.log(`Reporting pending on ${workflow.data.head_sha} ...`);
          await github.rest.repos.createCommitStatus({
            ...context.repo,
            sha: workflow.data.head_sha,
            state: 'pending',
            context: process.env.STATUS_NAME,
            description: 'Some required builds are still pending.',
            target_url: process.env.THIS_RUN_URL,
          });
          reportedPending = true;
        }
      }
    }
  }

  // report success if all required workflows we observed had a successful status
  if (foundRequired && allRequiredSucceeded) {
    console.log(`Reporting success on ${workflow.data.head_sha}`);
    await github.rest.repos.createCommitStatus({
      ...context.repo,
      sha: workflow.data.head_sha,
      state: 'success',
      context: process.env.STATUS_NAME,
      description: 'All required workflows have succeeded.',
      target_url: process.env.THIS_RUN_URL,
    });
  }
};

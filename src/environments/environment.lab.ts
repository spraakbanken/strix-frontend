// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: true,
  // api: "https://ws.spraakbanken.gu.se/ws/strixlabb/v2",
  api: "https://spraakbanken1.it.gu.se/strixlabb",
  auth: "https://sp.spraakbanken.gu.se/auth"
};

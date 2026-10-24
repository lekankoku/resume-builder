import { Env, handleApi } from './api';

export default {
  fetch: (request, env) => handleApi(request, env),
} satisfies ExportedHandler<Env>;

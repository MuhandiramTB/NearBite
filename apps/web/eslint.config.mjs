import base from '@nearbite/config/eslint';

export default [
  ...base,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
  {
    // Guard the security boundary (§9): the service-role client must never be
    // imported into client components. This flags accidental client imports.
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/supabase/server'],
              message:
                'Do not import the server/admin Supabase client into components. Use supabase/client in client code.',
            },
          ],
        },
      ],
    },
  },
];

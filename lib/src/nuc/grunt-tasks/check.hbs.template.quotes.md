# checkHbsTemplateQuotes

Search all existing handle bars files for attributes that are using hbs templates
that aren't enclosed with quotes and produce an error if any are found.

checkHbsTemplateQuotes: {
  hbs: {
    files: [
      {
        expand: true,
        src: '**/*.hbs'
      }
    ]
  }
}
import chalk from 'chalk';

export const logger = {
  info: (msg: string) => console.log(chalk.blue('ℹ ') + msg),
  success: (msg: string) => console.log(chalk.green('✔ ') + chalk.bold(msg)),
  warn: (msg: string) => console.log(chalk.yellow('⚠ ') + msg),
  error: (msg: string, err?: any) => {
    console.error(chalk.red('✖ ') + chalk.red.bold(msg));
    if (err) console.error(err);
  },
  section: (title: string) => {
    console.log('\n' + chalk.cyan.bold(`=== ${title} ===`));
  },
  keyVal: (key: string, val: string | number) => {
    console.log(`  ${chalk.gray(key + ':')} ${chalk.white.bold(val)}`);
  }
};

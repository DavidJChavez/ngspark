export async function run(command: string): Promise<void> {
    const [cmd, ...args] = command.split(' ');
    const proc = Bun.spawn([cmd!, ...args], {
        stdout: `inherit`,
        stderr: `inherit`,
        stdin: 'inherit'
    });
    await proc.exited;
}
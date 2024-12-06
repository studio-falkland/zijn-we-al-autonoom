# A script that removes any Jupyter notebook output before committing a file to Git
# @see https://gist.github.com/33eyes/431e3d432f73371509d176d0dfb95b6e?permalink_comment_id=4602158#gistcomment-4602158
# @author @konradmb

# Get the absolute path to this script
SCRIPT_PATH=$(dirname "$(realpath "$0")")

# Create the path to the venv directory
VENV_ACTIVATE="$SCRIPT_PATH/../.venv/bin/activate"

# GUARD: Check whether a venv has been created
if [ -f $VENV_ACTIVATE ]; then
    # If so, activate it
    source $VENV_ACTIVATE
fi

# Strip any info from the Jupyter notebook
jupyter nbconvert --ClearOutputPreprocessor.enabled=True --ClearMetadataPreprocessor.enabled=True --to=notebook --stdin --stdout --log-level=ERROR
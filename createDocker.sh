image_tag=$1
token=$2
ecr=$3
profile=$4
region=$5


if ! command -v docker &> /dev/null
then
    echo "docker not found, you must have docker installed"
    exit
fi

if ! command -v docker &> /dev/null
then
    echo "docker not found, you must have docker installed"
    exit
fi

if [ "$ecr" == "ecr" ]; then
	if test -z "$profile" || test -z "$region" || ! command -v aws &> /dev/null ; then
		echo "In order to push on ecr registry, aws cli, AWS profile and aws region are required"
		exit 1
	fi
	login=$(aws ecr get-login --profile $profile --region $region)
	get_login=$(echo $login | awk '{print $1 " " $2 " " $3 " " $4 " " $5 " " $6 " " $9}')
	echo "performing ecr login"
	$get_login
fi

echo "Building Docker image"
docker build -t $image_tag --build-arg IP2LOCATION_TOKEN=$token .
echo "Pushing image on Registry"
docker push $image_tag